import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({timestamps: true})
export class Admin extends Document{
    @Prop({required: true})
    name: string;
    @Prop({required: true, unique: true})
    email: string;
    @Prop({required: true, unique: true})
    phone: string;
    @Prop({required: true})
    password: string;
    @Prop({default: "admin"})
    role: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);