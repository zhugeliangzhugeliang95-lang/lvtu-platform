import { AdminShell } from "@/components/hotel-admin/AdminShell";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { FulfillmentOrders } from "./ui";

export default async function AdminOrdersPage(){await requireAdmin("/admin/orders");const orders=await prisma.order.findMany({where:{orderStatus:{in:["PAID","PROCESSING","FULFILLING","BOOKED"]}},include:{user:{select:{nickname:true,mobile:true,email:true}},requirement:{select:{destination:true,startDate:true,endDate:true,content:true,status:true}},trips:{select:{id:true},take:1}},orderBy:{updatedAt:"desc"},take:100});return <AdminShell title="订单履约" subtitle="付款审核通过后，录入确认号与凭证并完成预订"><FulfillmentOrders orders={orders.map(order=>({...order,createdAt:order.createdAt.toISOString(),updatedAt:order.updatedAt.toISOString(),travelDate:order.travelDate?.toISOString()||null,requirement:order.requirement?{...order.requirement,startDate:order.requirement.startDate?.toISOString()||null,endDate:order.requirement.endDate?.toISOString()||null}:null}))}/></AdminShell>}
