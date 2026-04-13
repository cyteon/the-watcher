export default function Sidebar() {
  return (
    <div class="flex flex-col lg:w-1/3">
      <a href="/dashboard/new-monitor" class="button px-4! w-fit">
        + Create New Monitor
      </a>
      <div class="border rounded-md p-2 flex-1 flex flex-col mt-4"></div>
    </div>
  );
}
