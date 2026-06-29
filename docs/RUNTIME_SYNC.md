# Runtime Sync

Runtime sync summarizes the existing Agent Memory sync status:

- write mode
- connection state
- waiting records
- synced records
- failed records
- last sync time

The runtime does not bypass the sync queue. Agent data still syncs through the existing approved path:

Runtime state -> Agent Memory records -> Edge Function when configured -> localStorage fallback when unavailable

No service-role key is exposed to the browser. No production business tables are written.
