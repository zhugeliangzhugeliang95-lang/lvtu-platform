import { redirect } from "next/navigation";

/** 旧链接保留可访问性，但不再展示虚构的顾问人物页面。 */
export default function ConsultantPage() {
  redirect("/ai");
}
