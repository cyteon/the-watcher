export default function DashboardLayout(props: { children: Node }) {
  return (
    <div class="h-screen">
      <nav class="border-b p-2 px-4">
        <h1 class="font-bold text-lg">The Watcher</h1>
      </nav>
      <div class="flex flex-col lg:flex-row p-4">
        <h1>sidebar</h1>
        <main class="flex-1 overflow-auto">{props.children}</main>
      </div>
    </div>
  );
}
