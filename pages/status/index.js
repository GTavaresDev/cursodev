import useSWR from "swr";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();

  return responseBody;
}

export default function StatusPage() {
  const response = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 5000, // Refresh every 5 seconds
  });
  return (
    <div>
      <h1>Status</h1>
      <UpdatedAT />
      <Database />
    </div>
  );
}

function UpdatedAT() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 5000, // Refresh every 5 seconds
  });
  let updatedAtText = "Carregando...";

  if (!isLoading && data) {
    updatedAtText = new Date(data.updated_at).toLocaleString();
  }

  return <div>Ultima atualização: {updatedAtText}</div>;
}

function Database() {
  const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
    refreshInterval: 5000, // Refresh every 5 seconds
  });

  let databaseInfo = {
    version: "Carregando...",
    openedConnections: "Carregando...",
    maxConnections: "Carregando...",
  };

  if (!isLoading && data) {
    databaseInfo = {
      version: data.dependencies.database.version,
      openedConnections: data.dependencies.database.opened_connections,
      maxConnections: data.dependencies.database.max_connections,
    };
  }

  return (
    <div>
      <h2>Database</h2>
      <div>Versão: {databaseInfo.version}</div>
      <div>Conexões abertas: {databaseInfo.openedConnections}</div>
      <div>Máximo de conexões: {databaseInfo.maxConnections}</div>
    </div>
  );
}
