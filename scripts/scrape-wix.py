import re, json, sys, time, urllib.request, urllib.parse, random

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

def fetch(url):
    url = urllib.parse.quote(url, safe=":/?=&%")
    r = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "hu-HU,hu;q=0.9"})
    return urllib.request.urlopen(r, timeout=45).read().decode("utf-8", "replace")

def balanced(h, start, open_c='{', close_c='}'):
    depth, i, instr, esc = 0, start, False, False
    while i < len(h):
        c = h[i]
        if instr:
            if esc: esc = False
            elif c == '\\': esc = True
            elif c == '"': instr = False
        else:
            if c == '"': instr = True
            elif c == open_c: depth += 1
            elif c == close_c:
                depth -= 1
                if depth == 0: return h[start:i+1]
        i += 1
    raise ValueError("unbalanced")

def product_from_html(h):
    m = re.search(r'"productPage_[A-Z]{3}_[^"]+":\{"catalog":\{"product":', h)
    if not m: return None
    return json.loads(balanced(h, h.index('{', m.end()-1)))

KEEP = ['id','name','urlPart','sku','ribbon','brand','price','comparePrice','discountedPrice',
        'formattedPrice','description','categoryIds','productType','isVisible','options',
        'customTextFields','additionalInfo','seoTitle','seoDescription']

def slim(p):
    o = {k: p.get(k) for k in KEEP}
    o['inventory'] = (p.get('inventory') or {}).get('status')
    o['media'] = [{'id': m['id'], 'w': m['width'], 'h': m['height'], 'title': m.get('title'),
                   'original': 'https://static.wixstatic.com/media/' + m['id']} for m in p.get('media', [])]
    return o

if __name__ == '__main__':
    urls = [l.strip() for l in open(sys.argv[1]) if l.strip()]
    if len(sys.argv) > 2: urls = urls[:int(sys.argv[2])]
    out, fails = [], []
    for n, u in enumerate(urls, 1):
        try:
            p = product_from_html(fetch(u))
            if p is None: raise ValueError('no product blob')
            out.append(slim(p))
            print(f"[{n}/{len(urls)}] ok  {out[-1]['name'][:40]:42} {out[-1]['price']:>9} {len(out[-1]['media'])} img", flush=True)
        except Exception as e:
            fails.append((u, str(e))); print(f"[{n}/{len(urls)}] FAIL {u}: {e}", flush=True)
        time.sleep(random.uniform(0.4, 0.9))
    json.dump(out, open('products.json','w',encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"\n{len(out)} ok, {len(fails)} failed -> products.json")
