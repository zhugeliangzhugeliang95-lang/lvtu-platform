import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUserIdFromCookie } from "@/lib/userAuth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { requireTrustedOrigin } from "@/lib/security/request";
import { MAX_UPLOAD_BYTES, sanitizePublicImage } from "@/lib/security/imageUpload";

export async function POST(req:Request){const userId=await getUserIdFromCookie();if(!userId)return NextResponse.json({error:"请先登录"},{status:401});const originError=requireTrustedOrigin(req);if(originError)return originError;const limited=enforceRateLimit(req,"payment:proof-upload",{limit:10,windowMs:10*60_000,identity:userId});if(limited)return limited;const declaredLength=Number(req.headers.get("content-length")||0);if(Number.isFinite(declaredLength)&&declaredLength>MAX_UPLOAD_BYTES+256*1024)return NextResponse.json({error:"图片不能超过 5MB"},{status:413});if(!req.headers.get("content-type")?.includes("multipart/form-data"))return NextResponse.json({error:"请选择图片文件"},{status:400});const form=await req.formData().catch(()=>null);const file=form?.get("file");if(!(file instanceof File))return NextResponse.json({error:"请选择图片文件"},{status:400});const sanitized=await sanitizePublicImage(file);if(!sanitized.ok)return NextResponse.json({error:sanitized.message},{status:sanitized.status});try{const filename=`payment-${crypto.randomBytes(16).toString("hex")}.webp`;const uploadDir=process.env.UPLOAD_DIR||path.join(process.cwd(),"uploads");await fs.mkdir(uploadDir,{recursive:true});await fs.writeFile(path.join(uploadDir,filename),sanitized.buffer,{flag:"wx",mode:0o600});return NextResponse.json({url:`/api/uploads/${filename}`});}catch{return NextResponse.json({error:"图片上传失败"},{status:500})}}
