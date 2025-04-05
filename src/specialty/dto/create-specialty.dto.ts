import { IsOptional, IsString } from 'class-validator';

export class CreateSpecialtyDto {
  @IsString()
  name: string;

  @IsString()
  icon: string; // Đường dẫn đến biểu tượng của chuyên khoa

  @IsOptional()
  @IsString()
  doctors: string[]; // Danh sách ID bác sĩ thuộc chuyên khoa (nếu có)
}
