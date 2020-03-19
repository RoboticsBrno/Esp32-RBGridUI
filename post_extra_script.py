import functools
import os
import hashlib
import subprocess
import json
import re
import shutil
import sys

VERSION = 3 # increase to force spiffs flash

def generate_amalgamations(source=None, target=None, env=None, base="."):
    web_dir = os.path.join(base, "web")
    if not os.path.isdir(web_dir):
        return

    data_dir = env.get("PROJECTDATA_DIR")
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
    dev_list = json.loads(dev_list)
    for d in dev_list:
        hasher.update(d.get("hwid", "").encode("utf-8"))

    current_sha1 = hasher.hexdigest()
    state_path = os.path.join(env.get("PROJECT_DIR"), ".last_uploadfs_sha1")
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
    try:
        Import("projenv") # this fails in pre: scripts
    except Exception as e:
        # The library.json extraScripts are only pre:, and we need a post: script
        # let's add one using platform.io internal APIs, what's the worst that can happen, right?
        extra_scripts = env.GetProjectOption("extra_scripts", [])
        extra_scripts.append("post:" + os.path.abspath("./post_extra_script.py"))

        cfg = env.GetProjectConfig()
        cfg.set("env:" + env["PIOENV"], "extra_scripts", extra_scripts)
    else:
        base = os.path.abspath(".")
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
        generate_amalgamations()
    else:
        parser.print_help()
        sys.exit(1)
