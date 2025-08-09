import React, { useEffect, useState, useRef } from 'react';
import Tree from 'rc-tree';
import 'rc-tree/assets/index.css';

const API_BASE = process.env.REACT_APP_API_BASE; // 例: https://xxxx.execute-api.ap-northeast-1.amazonaws.com/prod
const folderId = '276262437393'; // 既定フォルダ

function App() {
  const [treeData, setTreeData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [explorerToken, setExplorerToken] = useState(null);
  const [authState, setAuthState] = useState('checking'); // checking | signed-in | signed-out
  const explorerRef = useRef(null);

  // --- 1) ログイン（OAuth開始） ---
  const handleLogin = () => {
    window.location.href = `${API_BASE}/box/login`;
  };

  // --- 2) ダウンスコープトークン取得 ---
  const fetchDownscopedToken = async () => {
    try {
      const res = await fetch(`${API_BASE}/box/token/downscope?folder=${folderId}`, {
        method: 'GET',
        credentials: 'include', // ← 重要：HttpOnlyクッキー送信
      });
      if (res.status === 401) {
        setAuthState('signed-out');
        return null;
      }
      const data = await res.json();
      if (data?.access_token) {
        setAuthState('signed-in');
        return data.access_token;
      }
      return null;
    } catch (e) {
      console.error('downscope error', e);
      setAuthState('signed-out');
      return null;
    }
  };

  // --- 3) Content Explorer の描画 ---
  useEffect(() => {
    let mounted = true;

    async function initExplorer() {
      const token = await fetchDownscopedToken();
      if (!mounted || !token) return;
      setExplorerToken(token);
    }

    initExplorer();
    return () => { mounted = false; };
    // 初回のみ（トークンは短命なので、必要なら定期更新ロジックを追加）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (window.Box && explorerToken && explorerRef.current) {
      const explorer = new window.Box.ContentExplorer();
      explorer.show(folderId, explorerToken, {
        container: explorerRef.current,
        canDownload: false,
        canDelete: false,
        canUpload: false,
        defaultView: 'files',
      });
    }
  }, [explorerToken]);

  // --- 4) メタデータ付きツリーの取得（※ サーバ経由で安全に） ---
  useEffect(() => {
    let mounted = true;
    async function fetchTree() {
      try {
        const res = await fetch(`${API_BASE}/box/tree?folder=${folderId}`, {
          credentials: 'include', // ← 重要
        });
        if (res.status === 401) {
          setAuthState('signed-out');
          return;
        }
        const data = await res.json();
        if (mounted) setTreeData(data.tree || []);
        setAuthState('signed-in');
      } catch (e) {
        console.error('tree error', e);
        setAuthState('signed-out');
      }
    }
    fetchTree();
    return () => { mounted = false; };
  }, []);

  // --- 5) フィルタ ---
  const filterTree = (nodes) =>
    nodes
      .map((node) => {
        const match = node.title.toLowerCase().includes(searchTerm.toLowerCase());
        if (node.children) {
          const filtered = filterTree(node.children);
          if (filtered.length || match) return { ...node, children: filtered };
        } else if (match) {
          return node;
        }
        return null;
      })
      .filter(Boolean);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Box メタデータツリー</h2>

      <div style={{ marginBottom: '1rem' }}>
        {authState === 'signed-in' ? (
          <span>サインイン済み</span>
        ) : authState === 'checking' ? (
          <span>確認中...</span>
        ) : (
          <button onClick={handleLogin}>Box にサインイン</button>
        )}
      </div>

      <input
        type="text"
        placeholder="検索（ファイル名・フォルダ名・ステータス）"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
      />
      <Tree treeData={filterTree(treeData)} defaultExpandAll />

      <h2 style={{ marginTop: '2rem' }}>Box Content Explorer</h2>
      <div
        ref={explorerRef}
        style={{ height: '600px', border: '1px solid #ccc', marginTop: '1rem' }}
      />
    </div>
  );
}

export default App;
