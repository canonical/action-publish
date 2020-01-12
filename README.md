<p align="center">
  <a href="https://github.com/jhenstridge/snapcraft-publish-action/actions"><img alt="snapcraft-publish-action status" src="https://github.com/jhenstridge/snapcraft-publish-action/workflows/build-test/badge.svg"></a>
</p>

# Snapcraft Publish Action

This is a Github Action that can be used to publish [snap
packages](https://snapcraft.io) to the Snap Store.  In most cases, it
will be used with the `snapcraft-build-action` action to build the
package.  The following workflow should be sufficient for:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: jhenstridge/snapcraft-build-action@v1
      id: build
    - uses: jhenstridge/snapcraft-publish-action@v1
      with:
        store_login: ${{ secrets.STORE_LOGIN }}
        snap: ${{ steps.build.outputs.snap }}
        release: edge
```

This will build the project, upload the result to the store, and
release it to the `edge` channel.  If the `release` input parameter is
omitted, then the build will not be uploaded but not released.


## Store Login

In order to upload to the store, the action requires login
credentials.  Rather than a user name and password, the action expects
the data produced by the `snapcraft export-login` command.

As well as preventing the exposure of the password, it also allows the
credentials to be locked down to only the access the action requires:

```sh
$ snapcraft export-login --snaps=PACKAGE_NAME \
      --acls package_push,package_update,package_release exported.txt
```

This will produce a file `exported.txt` containing the login data,
which should be a multi-line file starting with `[login.ubuntu.com]`.
The credentials can be restricted further with the `--channels` and
`--expires` arguments if desired.

In order to make the credentials available to the workflow, they
should be stored as a repository secret:

1. choose the "Settings" tab.
2. choose "Secrets" from the menu on the left.
3. click "Add a new secret".
4. set the name to `STORE_LOGIN` (or whatever is referenced in the workflow), and paste the contents of `exported.txt` as the value.
