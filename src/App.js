import React, { useEffect, useState } from 'react';
import Tree from 'rc-tree';
import 'rc-tree/assets/index.css';

const accessToken = 'l4YhcgdsvLmDerRg8xgEMPJ5nIUkBCbs';
const folderId = '276262437393';
const templateKey = 'template9';

function App() {
  const [treeData, setTreeData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFolderItems = async (id) => {
      const res = await fetch(`https://api.box.com/2.0/folders/${id}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      const children = await Promise.all(
        data.entries.map(async (item) => {
          if (item.type === 'folder') {
            return {
              key: item.id,
              title: item.name,
              children: await fetchFolderItems(item.id),
            };
          } else {
            const metadataRes = await fetch(
              `https://api.box.com/2.0/files/${item.id}/metadata/enterprise/${templateKey}`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            const metadata = await metadataRes.json();
            return {
              key: item.id,
              title: `${item.name} (${metadata.status || 'ステータス不明'})`,
              isLeaf: true,
            };
          }
        })
      );

      return children;
    };

    fetchFolderItems(folderId).then(setTreeData);
  }, []);

  const filterTree = (nodes) =>
    nodes
      .map((node) => {
        const match =
          node.title.toLowerCase().includes(searchTerm.toLowerCase());
        if (node.children) {
          const filteredChildren = filterTree(node.children);
          if (filteredChildren.length || match) {
            return { ...node, children: filteredChildren };
          }
        } else if (match) {
          return node;
        }
        return null;
      })
      .filter(Boolean);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Box メタデータツリー</h2>
      <input
        type="text"
        placeholder="検索（ファイル名・フォルダ名・ステータス）"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
      />
      <Tree treeData={filterTree(treeData)} defaultExpandAll />
    </div>
  );
}

export default App;
