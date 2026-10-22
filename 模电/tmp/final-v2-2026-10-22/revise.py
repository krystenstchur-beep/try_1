from pathlib import Path
import re,os,json,hashlib,difflib
from urllib.parse import unquote

root=Path.cwd().resolve();base=root/'模电';work=Path(__file__).resolve().parent
source=base/'模电第三章_轻量版_v2.md'
backup=work/'模电第三章_轻量版_v2_有限修订前.md'
if not backup.exists():backup.write_bytes(source.read_bytes())
old=backup.read_text(encoding='utf-8');text=old
files=[]
for folder,dirs,names in os.walk(root):
    dirs[:]=[d for d in dirs if d not in ['.git','node_modules','final-v2-2026-10-22']]
    files.extend(Path(folder)/n for n in names)
index={}
for p in files:index.setdefault(p.name.casefold(),[]).append(p)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
protected=[p for p in files if p!=source and ('tmp' not in p.parts or p.suffix.lower() in ['.jpg','.png','.pdf','.pptx','.md'])]
hashfile=work/'protected-hashes.json'
if not hashfile.exists():hashfile.write_text(json.dumps({str(p):sha(p) for p in protected},ensure_ascii=False,indent=2),encoding='utf-8')

old_sentence='AC 时理想直流电压源接交流地，其内阻仍须按实际模型保留；独立源置零不等于受控源置零。'
new_sentence='AC 时，理想直流电压源的增量置零后等效为短路；其两端成为同一个交流节点，若一端接地，另一端即为交流地。理想电压源本身没有需要另行保留的内阻；只有实际电源模型中原已包含的内阻或内阻抗，才按原模型保留。独立源置零不等于受控源置零。'
assert text.count(old_sentence)==1;text=text.replace(old_sentence,new_sentence)

pattern=re.compile(r'(!?)\[([^\]]*)\]\((<[^>]+>|[^\s\n)]+)\)')
audit=[];missing=[];referenced=set()
def fix(m):
    image,label,raw=m.groups();url=raw.strip('<>')
    if url.startswith(('http://','https://','mailto:')):return m[0]
    path,sep,frag=url.partition('#');path=unquote(path)
    if not path:return m[0]
    absolute=bool(re.match(r'^[A-Za-z]:[/\\]',path))
    direct=Path(path) if absolute else (base/path).resolve()
    chosen=None;mode='direct'
    if direct.is_file() and direct.is_relative_to(root):chosen=direct
    else:
        candidates=index.get(Path(path).name.casefold(),[])
        suffix=path.replace('\\','/').lstrip('./').casefold()
        suffix_matches=[p for p in candidates if p.as_posix().casefold().endswith('/'+suffix)]
        if len(suffix_matches)==1:chosen=suffix_matches[0];mode='workspace-suffix'
        elif len(candidates)==1:chosen=candidates[0];mode='workspace-name'
        elif candidates and len({sha(p) for p in candidates})==1:
            chosen=min(candidates,key=lambda p:len(p.parts));mode='identical-workspace-copy'
    if chosen:
        referenced.add(chosen);relative=Path(os.path.relpath(chosen,base)).as_posix()
        dest=relative+('#'+frag if sep else '')
        rendered='<'+dest+'>' if re.search(r'[\s()]',dest) else dest
        replacement=f'{image}[{label}]({rendered})'
        audit.append({'original':url,'target':str(chosen),'relative':dest,'mode':mode,'changed':replacement!=m[0]})
        return replacement
    missing.append({'original':url,'name':Path(path).name,'desktop_file_exists':direct.is_file(),'workspace_candidates':[str(p) for p in index.get(Path(path).name.casefold(),[])]})
    assert not image,'Unresolved image requires separate review: '+url
    return f'《{Path(path).name}》【待核对：工作区暂无该资料副本，原记录为桌面路径】' if absolute else f'{label}（{path}）【待核对：尚未在项目工作区定位到该资料】'
text=pattern.sub(fix,text)
text=text.replace('完整课本照片与课件的部分回查入口仍位于 `tmp/analog` 和桌面资料目录，迁移原资料时需保留相应目录。','课本照片与课件的项目内回查入口位于 `tmp/analog`；没有工作区副本的桌面资料保留名称并标记待核对，迁移时请一并保留已有资料目录。')
text=text.replace('本轮仅修订 Markdown 与配图，不提交或推送。','本次有限修订另核验资源路径，澄清理想电压源置零与实际电源内阻的区别，并由同一 Markdown 导出 HTML、PDF；不提交或推送。')

head=lambda s:re.findall(r'^#{1,6} .+$',s,re.M)
assert head(old)==head(text)
quotes=lambda s:[l for l in s.splitlines() if l.startswith('>')]
assert quotes(old)==quotes(text),'Original quote changed'
ids=re.findall(r'<a\s+id="([^"]+)"',text);assert len(ids)==len(set(ids))
for m in pattern.finditer(text):
    url=m[3].strip('<>')
    if url.startswith(('http://','https://','mailto:')):continue
    p,sep,frag=url.partition('#');p=source if not p else (base/unquote(p)).resolve()
    assert p.exists(),url
    if frag and p.suffix.lower()=='.md':
        content=text if p==source else p.read_text(encoding='utf-8')
        assert f'id="{unquote(frag)}"' in content,url
source.write_text(text,encoding='utf-8')
(work/'resource-audit.json').write_text(json.dumps({'source':str(source),'scanned_workspace_files':len(files),'references':audit,'missing_workspace_copies':missing},ensure_ascii=False,indent=2),encoding='utf-8')
(work/'finite-revision.diff').write_text(''.join(difflib.unified_diff(old.splitlines(True),text.splitlines(True),fromfile='修订前',tofile='有限修订后')),encoding='utf-8')
print(json.dumps({'workspace_files':len(files),'local_resource_references':len(audit),'resolved_unique_files':len(referenced),'missing_workspace_copies':missing,'all_headings_unchanged':True,'original_quote_lines_unchanged':len(quotes(text)),'protected_files':len(protected)},ensure_ascii=False,indent=2))
