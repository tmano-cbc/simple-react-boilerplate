import React, { useEffect, useState } from 'react';

const accessToken = 'YOUR_ACCESS_TOKEN'; // 一時的にハードコード（本番ではLambdaなどで安全に管理）
const fileId = 'YOUR_FILE_ID';
const templateKey = 'YOUR_TEMPLATE_KEY';

function App() {
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(
          `https://api.box.com/2.0/files/${fileId}/metadata/enterprise/${templateKey}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        console.error('Error fetching metadata:', err);
        setError(err.message);
      }
    };

    fetchMetadata();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Box Metadata Viewer</h1>
      {error && <p style={{ color: 'red' }}>エラー: {error}</p>}
      {metadata ? (
        <div>
          <p><strong>契約日:</strong> {metadata.contractDate}</p>
          <p><strong>担当者:</strong> {metadata.owner}</p>
          <p><strong>ステータス:</strong> {metadata.status}</p>
        </div>
      ) : (
        <p>読み込み中...</p>
      )}
    </div>
  );
}

export default App;
