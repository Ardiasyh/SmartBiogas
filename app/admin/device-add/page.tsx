"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AddDevicePage() {
  const [form, setForm] = useState({
    name: "",
    lat: "",
    lng: "",
    alamat: "",
  });

  const submit = async () => {
    if (!form.name || !form.lat || !form.lng) return;

    await addDoc(collection(db, "devices"), {
      name: form.name,
      lat: Number(form.lat),
      lng: Number(form.lng),
      alamat: form.alamat || "",
    });

    setForm({ name: "", lat: "", lng: "", alamat: "" });
  };

  return (
    <div className="p-6">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Tambah Lokasi Alat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nama alat"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Latitude"
            value={form.lat}
            onChange={(e) => setForm({ ...form, lat: e.target.value })}
            type="number"
          />
          <Input
            placeholder="Longitude"
            value={form.lng}
            onChange={(e) => setForm({ ...form, lng: e.target.value })}
            type="number"
          />
          <Input
            placeholder="Alamat (opsional)"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
          />

          <Button onClick={submit} className="w-full">
            Simpan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
