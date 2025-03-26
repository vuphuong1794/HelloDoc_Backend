import { IsNotEmpty, IsMongoId, IsString, IsEnum, IsOptional, IsDateString, Matches } from 'class-validator';

export class BookAppointmentDto {
    @IsNotEmpty()
    @IsMongoId()
    doctorID: string;

    @IsNotEmpty()
    @IsMongoId()
    patientID: string;

    @IsNotEmpty()
    @IsDateString()
    date: string; // Định dạng chuẩn ISO 8601 (YYYY-MM-DD)

    @IsNotEmpty()
    @Matches(/^([0-1]\d|2[0-3]):([0-5]\d)$/, {
        message: 'Time must be in HH:mm format',
    })
    time: string; // Chỉ chấp nhận định dạng HH:mm (24h)

    @IsOptional()
    @IsEnum(['pending', 'confirmed', 'cancelled'], {
        message: 'Status must be pending, confirmed, or cancelled',
    })
    status?: string = 'pending'; // Mặc định là 'pending'

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
