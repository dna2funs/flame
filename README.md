# flame

<img src="https://github.com/dna2funs/flame/raw/main/node/static/img/logo.png" alt="FlameLogo" width="72" height="72" />

a service for source code comprehesion toolkits

### golang: git/p4 server

use https://github.com/google/zoekt as api server framework (all zoekt related logic removed)

```
SELF=$(cd `dirname $0`; pwd)

mkdir -p $SELF/data/{src,keyval}

# if use cygwin on Windows: ZOEKT_CYGWIN_BASE_DIR=`cygpath -w /`
KEYVAL_STORAGE_FS_BASE_DIR=`/path/to/data/keyval` \
ZOEKT_DEBUG=1 \
ZOEKT_P4_BIN=`which git` \
ZOEKT_GIT_BIN=`which p4` \
/path/to/bin/zoekt-webserver -fs_base_dir /path/to/data/src
```

##### how to build ctags?

ref: https://github.com/universal-ctags

ref: https://github.com/google/zoekt/blob/master/doc/ctags.md

```bash
sudo apt-get install
  pkg-config autoconf \
  libseccomp-dev libseccomp \
  libjansson-dev libjansson 

./autogen.sh
LDFLAGS=-static ./configure --enable-json --enable-seccomp
make -j4

# create tarball
NAME=ctags-$(date --iso-8601=minutes | tr -d ':' | sed 's|\+.*$||')-$(git show --pretty=format:%h -q)
mkdir ${NAME}
cp ctags ${NAME}/universal-ctags
tar zcf ${NAME}.tar.gz ${NAME}/
```

### node: api wrapping server

```
npm install

```

### node: web ui client

```
...
```
