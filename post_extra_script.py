#!/usr/bin/env python3

import functools
import os
import hashlib
import subprocess
import json
import re
import shutil
import sys
import gzip

VERSION = 5 # increase to force spiffs flash

PROCESS_ENC = "mbcs" if sys.platform.startswith("win") else "utf-8"

def autodisable_old_lib(base, env):
    web_dir = os.path.join(base, "web")
    if not os.path.isdir(web_dir):
        return False

    saved_mtime = 0
    our_mtime = 1
    for root, dirs, files in os.walk(web_dir):
        for name in files:
            our_mtime = max(os.path.getmtime(os.path.join(root, name)), our_mtime)
    our_mtime = int(our_mtime)

    mtime_path = os.path.join(env.get("PROJECT_DIR"), ".gridui_mtime")
    if os.path.exists(mtime_path):
        with open(mtime_path, "r") as f:
            saved_mtime = int(f.read())

    if our_mtime > saved_mtime:
        with open(mtime_path, "w") as f:
            f.write("%d" % our_mtime)
        return False
    return our_mtime != saved_mtime

def generate_amalgamations(source=None, target=None, env=None, base="."):
    web_dir = os.path.join(base, "web")
    if not os.path.isdir(web_dir):
        return

    data_dir = env.get("PROJECT_DATA_DIR", env.get("PROJECTDATA_DIR"))
    # Probably unsafe from a library
    #if os.path.isdir(data_dir):
    #    shutil.rmtree(data_dir)
    try:
        os.mkdir(data_dir, 0o755)
    except OSError:
        pass

    fn_re = re.compile(r"^[0-9]+_.+\.([^.]+)$")
    to_combine = {}
    for root, dirs, files in os.walk(web_dir):
        for name in files:
            m = fn_re.match(name)
            path = os.path.join(root, name)
            if not m:
                shutil.copy(path, os.path.join(data_dir, os.path.relpath(path, web_dir)))
            else:
                to_combine.setdefault(m.group(1), []).append(path)

    for ext, files in to_combine.items():
        files.sort(key=lambda p: os.path.basename(p))
        dst_path = os.path.join(data_dir, "combined." + ext)
        print("Combining to %s:\n    %s" % (dst_path, "\n    ".join(files)))
        with open(dst_path, "wb") as dst:
            for path in files:
                 with open(path, "rb") as src:
                     shutil.copyfileobj(src, dst)
                     dst.write(b"\n")

    for root, _, files in os.walk(data_dir):
        for fn in files:
            if fn.endswith(".gz"):
                continue
            path = os.path.join(root, fn)
            with open(path, "rb") as src:
                dst = gzip.GzipFile(path + ".gz", "wb", 9, mtime=0)
                try:
                    shutil.copyfileobj(src, dst)
                finally:
                    dst.close()

def after_upload(source, target, env, base="."):
    web_dir = os.path.join(base, "web")
    if not os.path.isdir(web_dir):
        return

    hasher = hashlib.sha1()
    hasher.update(str(VERSION).encode("utf-8"))

    for root, dirs, files in os.walk(web_dir):
        dirs.sort()
        for name in sorted(files):
            with open(os.path.join(root, name), "rb") as f:
                for chunk in iter(lambda: f.read(32787), b""):
                    hasher.update(chunk)

    try:
        with open(env.get("PARTITIONS_TABLE_CSV"), "rb") as f:
            hasher.update(f.read())
    except OSError as e:
        pass

    dev_list = subprocess.check_output([ "pio", "device", "list", "--serial", "--json-output" ], env=env["ENV"])
    dev_list = json.loads(dev_list.decode(PROCESS_ENC))
    for d in dev_list:
        hasher.update(d.get("hwid", "").encode("utf-8"))

    current_sha1 = hasher.hexdigest()
    state_path = os.path.join(env.get("PROJECT_DIR"), ".gridui_uploadfs_sha1")
    if os.path.exists(state_path):
        with open(state_path, "r") as f:
            if f.read() == current_sha1:
                print("SPIFFS data are the same.")
                return

    print("SPIFFS data changed, running uploadfs target!")

    env.Execute("pio run -t uploadfs")

    with open(state_path, "w") as f:
        f.write(current_sha1)

if "Import" in locals():
    #print(os.getcwd(), env.Dump())
    Import("env")

    this_post_path = "post:" + os.path.abspath("./post_extra_script.py")
    extra_scripts = env.GetProjectOption("extra_scripts", [])

    if this_post_path not in extra_scripts:
        # The library.json extraScripts are only pre:, and we need a post: script
        # let's add one using platform.io internal APIs, what's the worst that can happen, right?
        extra_scripts.append(this_post_path)
        cfg = env.GetProjectConfig()
        cfg.set("env:" + env["PIOENV"], "extra_scripts", extra_scripts)
    else:
        base = os.path.abspath(".")
        if autodisable_old_lib(base, env):
            print("Autodisabling %s" % base)
        else:
            print("Using %s" % base)
            env.AddPreAction("$BUILD_DIR/spiffs.bin", functools.partial(generate_amalgamations, base=base))
            env.AddPostAction("upload", functools.partial(after_upload, base=base))

elif __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest='cmd')

    sub = subparsers.add_parser("generate", help="Generate amalgamations from web/ to data/")

    args = parser.parse_args()

    env = {
        "PROJECTDATA_DIR": "data",
    }

    if args.cmd == "generate":
        generate_amalgamations(env=env)
    else:
        parser.print_help()
        sys.exit(1)
