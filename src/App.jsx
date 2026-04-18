function App() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-5">
        <h2 className="text-2xl mb-6">Sistema</h2>

        <nav className="flex flex-col gap-3">
          <button className="text-left hover:bg-gray-800 p-2 rounded">
            Dashboard
          </button>

          <button className="text-left hover:bg-gray-800 p-2 rounded">
            Clientes
          </button>

          <button className="text-left hover:bg-gray-800 p-2 rounded">
            Produtos
          </button>

          <button className="text-left hover:bg-gray-800 p-2 rounded">
            Movimentações
          </button>

          <button className="text-left hover:bg-gray-800 p-2 rounded">
            Gastos
          </button>
        </nav>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl mb-4">Dashboard</h1>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <p>Clientes</p>
            <h2 className="text-xl font-bold">0</h2>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <p>Produtos</p>
            <h2 className="text-xl font-bold">0</h2>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <p>Estoque</p>
            <h2 className="text-xl font-bold">0</h2>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <p>Gastos</p>
            <h2 className="text-xl font-bold">0</h2>
          </div>
        </div>
      </main>

    </div>
  );
}

export default App;