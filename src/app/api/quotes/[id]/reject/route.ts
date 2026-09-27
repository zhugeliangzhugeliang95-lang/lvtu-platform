import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { requireTrustedOrigin } from "@/lib/security/request";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){const originError=requireTrustedOrigin(req);if(originError)return originError;const userId=await getUserIdFromCookie();if(!userId)return NextResponse.json({error:"请先登录"},{status:401});const {id}=await params;const quote=await prisma.quote.findUnique({where:{id},include:{requirement:true}});if(!quote||quote.requirement.userId!==userId)return NextResponse.json({error:"报价不存在"},{status:404});if(!["SENT","VIEWED"].includes(quote.status))return NextResponse.json({error:"当前报价不可拒绝"},{status:400});await prisma.$transaction([prisma.quote.update({where:{id},data:{status:"REJECTED"}}),prisma.requirement.update({where:{id:quote.requirementId},data:{status:"IN_REVIEW",priceStatus:"PENDING_CONFIRMATION"}}),prisma.notification.create({data:{userId,title:"已暂不预订",content:"顾问已收到你的决定。如需调整日期或服务规格，可联系客服重新确认。",type:"QUOTE"}})]);return NextResponse.json({ok:true});}
