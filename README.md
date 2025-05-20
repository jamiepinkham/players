```
cp .env.template .env //fill in values
docker compose up --build
```

```
[+] Running 5/5
 ✔ assets                      Built                                                                        0.0s 
 ✔ web                         Built                                                                        0.0s 
 ✔ Container players-db-1      Created                                                                      0.0s 
 ✔ Container players-assets-1  Recreated                                                                    0.1s 
 ✔ Container players-web-1     Recreated                                                                    0.1s 
Attaching to assets-1, db-1, web-1
db-1      | 
db-1      | PostgreSQL Database directory appears to contain a database; Skipping initialization
db-1      | 
db-1      | 2025-05-20 09:30:11.538 UTC [1] LOG:  starting PostgreSQL 13.21 (Debian 13.21-1.pgdg120+1) on aarch64-unknown-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit
db-1      | 2025-05-20 09:30:11.540 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
db-1      | 2025-05-20 09:30:11.540 UTC [1] LOG:  listening on IPv6 address "::", port 5432
db-1      | 2025-05-20 09:30:11.541 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-1      | 2025-05-20 09:30:11.545 UTC [27] LOG:  database system was shut down at 2025-05-20 09:29:14 UTC
db-1      | 2025-05-20 09:30:11.552 UTC [1] LOG:  database system is ready to accept connections
web-1     | 09:30:11 web.1  | started with pid 7
assets-1  | [watch] build finished, watching for changes...
web-1     | 09:30:13 web.1  | => Booting Puma
web-1     | 09:30:13 web.1  | => Rails 6.1.7 application starting in development 
web-1     | 09:30:13 web.1  | => Run `bin/rails server --help` for more startup options
web-1     | 09:30:13 web.1  | Puma starting in single mode...
web-1     | 09:30:13 web.1  | * Puma version: 6.0.0 (ruby 3.1.2-p20) ("Sunflower")
web-1     | 09:30:13 web.1  | *  Min threads: 5
web-1     | 09:30:13 web.1  | *  Max threads: 5
web-1     | 09:30:13 web.1  | *  Environment: development
web-1     | 09:30:13 web.1  | *          PID: 7
web-1     | 09:30:13 web.1  | * Listening on http://0.0.0.0:3000
web-1     | 09:30:13 web.1  | Use Ctrl-C to stop
assets-1  | Sass is watching for changes. Press Ctrl-C to stop.
assets-1  | 
```
or if you have access to https://connect-api.cuscus-morpho.ts.net use

`bin/dev`