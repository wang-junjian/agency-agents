import json
import re
import os

def extract_agents(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split content by division headers (### )
    sections = re.split(r'\n### ', content)
    
    agents_data = []

    for section in sections[1:]: # skip the header part before the first category
        # Split line by line to parse the section title
        lines = section.split('\n')
        title_line = lines[0]
        
        # Regex to handle emojis and Eng name: 💻 工程学部 (Engineering Division)
        title_match = re.search(r'(.*?) \((.*?)\)', title_line)
        if title_match:
            div_zh = title_match.group(1).strip()
            div_en = title_match.group(2).strip()
        else:
            div_zh = title_line.strip()
            div_en = ""

        # Find tables: | 代理 | 专长 | 何时使用 |
        # Use regex to find the start of the table rows after the separator
        # Note: tables can have multiple rows.
        table_match = re.search(r'\| 代理 \| 专长 \| 何时使用 \|\n\|[-| ]+\|\n(.*?)(?=\n\n|\n#|\Z)', section, re.DOTALL)
        
        if table_match:
            rows = table_match.group(1).strip().split('\n')
            for row in rows:
                if not row.strip().startswith('|'):
                    continue
                
                # Split columns and clean up
                # row looks like: | 🎨 [前端人员](...) | ... | ... |
                cols = row.split('|')
                if len(cols) < 5: # Needs at least 5 elements (| and 3 data columns and |)
                    continue
                
                agent_col = cols[1].strip()
                specialty = cols[2].strip()
                use_case = cols[3].strip()

                # Parse icon, name, and link from the first column
                icon = ""
                name = ""
                link = ""

                # Look for name and link: [Name](Link)
                name_link_match = re.search(r'\[(.*?)\]\((.*?)\)', agent_col)
                if name_link_match:
                    name = name_link_match.group(1).strip()
                    link = name_link_match.group(2).strip()
                    # Icon is the part before the square bracket
                    icon_part = agent_col[:name_link_match.start()].strip()
                    if icon_part:
                        icon = icon_part
                else:
                    name = agent_col
                    link = "#"

                agents_data.append({
                    "category_zh": div_zh,
                    "category_en": div_en,
                    "icon": icon,
                    "name": name,
                    "link": f"https://github.com/msitarzewski/agency-agents/blob/main/{link}" if link != "#" else "#",
                    "specialty": specialty,
                    "use_case": use_case
                })

    return agents_data

if __name__ == "__main__":
    readme_path = "README_CN.md"
    output_path = "web-showcase/data.json"
    
    if os.path.exists(readme_path):
        data = extract_agents(readme_path)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Successfully extracted {len(data)} agents to {output_path}")
    else:
        print(f"Error: {readme_path} not found.")
