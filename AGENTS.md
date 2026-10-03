# Release artifact retention

After successfully building and verifying a new release, delete older
`RL-Tracker-Setup-<version>.exe` files and their matching `.exe.blockmap` files
from `dist`. Keep the current version. Do not delete the previous installer
before the replacement build succeeds.

The owner archives installers in GitHub Releases. Local cleanup must not
delete or modify published release assets.
