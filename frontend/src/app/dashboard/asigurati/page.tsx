import { getIndividualUsers, deleteIndividualUser, createIndividualUser, getCurrentUserRole, getUnassignedIndividuals } from "../../actions/user";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, User, MapPin } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AsiguratiPage() {
  const role = await getCurrentUserRole();
  if (role === "individual") {
    redirect("/dashboard");
  }

  const users = await getIndividualUsers();
  const unassignedUsers = await getUnassignedIndividuals();

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Utilizatori Asigurați</h1>
          <p className="text-slate-400">
            Gestionează persoanele fizice asigurate de compania ta.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ADD USER FORM */}
        <div className="md:col-span-1">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-green-500" />
                Adaugă Asigurat Nou
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createIndividualUser} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 block mb-1">Selectează Utilizator</label>
                  <select
                    name="stackUserId"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white"
                  >
                    <option value="">Alege o persoană fizică nealocată...</option>
                    {unassignedUsers.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                  Înregistrează Asigurat
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* USERS LIST */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {users.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 flex items-center justify-center p-10">
              <p className="text-slate-400">Nu ai niciun utilizator asigurat încă.</p>
            </Card>
          ) : (
            users.map((u) => (
              <Card key={u.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-5 flex flex-col md:flex-row items-center gap-4">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-medium text-white">{u.name}</h3>
                    <p className="text-sm text-slate-400">{u.email}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/terenuri?assignTo=${u.stack_user_id}`}>
                      <Button variant="outline" className="border-green-600 text-green-500 hover:bg-green-600/10">
                        <MapPin className="h-4 w-4 mr-2" /> Selectează Terenuri
                      </Button>
                    </Link>

                    <form action={deleteIndividualUser.bind(null, u.id)}>
                      <Button type="submit" variant="destructive" size="icon" className="bg-red-900/50 hover:bg-red-600 text-red-400 hover:text-white">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
