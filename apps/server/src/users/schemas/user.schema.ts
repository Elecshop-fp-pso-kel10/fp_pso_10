import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true, default: false })
  isAdmin!: boolean;

  @Prop({ type: String, default: null })
  refreshToken?: string | null;

  // Any access token issued (iat) before this timestamp is considered
  // revoked. Set on logout so previously-issued access tokens stop
  // working immediately, even though the JWT itself hasn't expired yet.
  @Prop({ type: Date, default: null })
  tokenInvalidBefore?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);