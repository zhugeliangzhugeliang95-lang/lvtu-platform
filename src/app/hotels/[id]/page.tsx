import { redirect } from "next/navigation";

export default async function HotelDetailPage() {
  redirect("/inquiry?service=hotel");
}
