import UserTable from "@/components/admin/users-table"

export default function AdminUsersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <UserTable />
    </div>
  )
}
