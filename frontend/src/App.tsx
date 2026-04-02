function App() {
  return (
    <div className="min-h-dvh bg-bg-base font-body text-text">
      <main className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 lg:px-6">
        <p className="font-body text-sm text-text-muted">
          Fabric Awinings · dev (Docker + Vite HMR)
        </p>
        <h1 className="font-heading mt-4 text-4xl font-black tracking-tight text-text md:text-6xl lg:text-7xl">
          Фабрика Тентов
        </h1>
        <p className="mt-4 max-w-xl font-body text-lg text-text-muted">
          Измените <code className="rounded bg-surface px-1.5 py-0.5 text-sm text-text">src/App.tsx</code> или стили — страница обновится в браузере без перезагрузки контейнера.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <button
            type="button"
            className="inline-flex h-14 items-center justify-center rounded-[40px] bg-accent px-8 font-body text-base font-medium tracking-wide text-surface shadow-[0_4px_8px_0_rgba(232,122,0,0.25)] transition hover:scale-[1.02] hover:bg-[#c65f00]"
            style={{ letterSpacing: '0.02em' }}
          >
            Заказать расчёт
          </button>
          <span className="self-center font-body text-2xl font-bold text-accent">
            от 12 500 ₽
          </span>
        </div>
      </main>
    </div>
  )
}

export default App
