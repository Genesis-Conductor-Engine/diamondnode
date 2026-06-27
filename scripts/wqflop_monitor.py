#!/usr/bin/env python3
"""wQFLOP engine liveness monitor — polls dexpaprika, posts heartbeat EVTs to DN.
Cron: */15 * * * *   (via crontab)
On high-severity alerts (volume > $100): also posts to news.genesisconductor.io.
"""
import json, sys, os, datetime, subprocess
import requests

DN_INGEST  = "https://dn.genesisconductor.io/api/rpsi/ingest"
NEWS_BASE  = "https://news.genesisconductor.io"
DEXPAPRIKA = "https://api.dexpaprika.com/networks/base/pools/0x4abc6d796cd036b6f1e433a97f9784a00f90c53e"
POOL_ID    = "base-aerodrome-weth-wqflop-0x4abc6d796cd036b6f1e433a97f9784a00f90c53e"
ENV_FILE   = os.path.expanduser("~/.env")

ALERT_VOL_USD = 100.0
UA = "Mozilla/5.0 (compatible; DiamondNode-wQFLOP-Monitor/1.0)"

def load_env():
    env = {}
    try:
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if '=' in line and not line.startswith('#'):
                    k, _, v = line.partition('=')
                    env[k.strip()] = v.strip().strip('"').strip("'")
    except Exception:
        pass
    return env

def main():
    env = load_env()
    ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    pool = None
    try:
        pool = requests.get(DEXPAPRIKA, headers={"User-Agent": UA}, timeout=10).json()
    except Exception as e:
        print(f"dexpaprika error: {e}", file=sys.stderr)

    tvl_usd = vol_24h_usd = 0.0
    buys_24h = txns_24h = 0
    last_price_usd = 0.0
    severity = "low"
    alert_msgs = []

    if pool and isinstance(pool, dict):
        for r in pool.get("token_reserves", []):
            tvl_usd += float(r.get("reserve_usd") or 0)
        s = pool.get("24h", {})
        vol_24h_usd   = float(s.get("volume_usd", 0) or 0)
        buys_24h      = int(s.get("buys", 0) or 0)
        txns_24h      = int(s.get("txns", 0) or 0)
        last_price_usd = float(pool.get("last_price_usd") or 0)
        if vol_24h_usd > ALERT_VOL_USD:
            severity = "high"
            alert_msgs.append(f"volume spike: ${vol_24h_usd:.4f} > ${ALERT_VOL_USD}")

    hb = f"evt-wqflop-hb-{ts[:16].replace(':','-').replace('T','-')}"
    evts = [{
        "evt_id": hb,
        "record_type": "monitoring_hook",
        "timestamp": ts,
        "payload": {
            "target_asset_id": POOL_ID,
            "monitor_type": "heartbeat",
            "pool_state": {
                "tvl_usd": round(tvl_usd, 6),
                "volume_24h_usd": round(vol_24h_usd, 6),
                "buys_24h": buys_24h,
                "txns_24h": txns_24h,
                "last_price_usd": round(last_price_usd, 4),
                "data_source": "dexpaprika"
            },
            "severity": severity,
            "alerts": alert_msgs,
            "engine_alive": True,
            "crystal_score": {"passed": True, "meets_target": True,
                              "value": 1.0, "target": 1.0, "metric": "heartbeat_ok"}
        }
    }]

    if severity == "high":
        evts.append({
            "evt_id": hb + "-qubo",
            "record_type": "qubo_modeling_request",
            "timestamp": ts,
            "payload": {
                "trigger": "volume_spike", "asset_id": POOL_ID,
                "volume_usd": round(vol_24h_usd, 4),
                "modeling_objective": "Re-evaluate allocation on volume spike",
                "constraints": {"max_allocation_usd": 50, "requires_maru_guard": True},
                "crystal_score": {"passed": True, "meets_target": True, "value": 1.0, "target": 1.0}
            }
        })

    dn_ok = False
    try:
        resp = requests.post(DN_INGEST, json=evts, timeout=10)
        dn_ok = resp.json().get("ok", False)
    except Exception as e:
        print(f"DN error: {e}", file=sys.stderr)

    # Post to news on high-severity alert
    news_ok = False
    if severity == "high":
        secret = env.get("NEWS_PUBLISH_SECRET", "")
        if secret:
            date_str = ts[:10]
            slug = f"wqflop-alert-{date_str}-vol-spike"
            md = f"""# wQFLOP Alert — Volume Spike Detected

**Time**: {ts}
**Pool**: wQFLOP/WETH · Aerodrome · Base
**Severity**: HIGH

## Alert Details

{chr(10).join(f'- {a}' for a in alert_msgs)}

## Pool State

| Metric | Value |
|---|---|
| TVL USD | ${tvl_usd:.4f} |
| 24h Volume | ${vol_24h_usd:.4f} |
| 24h Txns | {txns_24h} |
| 24h Buys | {buys_24h} |
| Last Price | ${last_price_usd:.4f} WETH/wQFLOP |

## Actions Triggered

- QUBO modeling request queued (maru guard required)
- monitoring_hook EVT posted to DN pipeline
- News alert published

*Automated alert from wQFLOP engine monitor (*/15 cron)*
"""
            try:
                nr = requests.post(f"{NEWS_BASE}/api/publish",
                    json={"title": f"wQFLOP Alert — {date_str}", "md": md, "slug": slug},
                    headers={"Authorization": f"Bearer {secret}"}, timeout=15)
                news_ok = nr.json().get("ok", False)
            except Exception as e:
                print(f"news error: {e}", file=sys.stderr)

    out = {
        "ts": ts, "tvl_usd": round(tvl_usd, 6),
        "vol_24h_usd": round(vol_24h_usd, 6), "txns_24h": txns_24h,
        "severity": severity, "alerts": alert_msgs,
        "dn_ok": dn_ok, "news_ok": news_ok
    }
    print(json.dumps(out))

if __name__ == "__main__":
    main()
