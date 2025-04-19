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
    @IsEnum(['pending', 'done', 'cancelled'], {
        message: 'Status must be pending, done, or cancelled',
    })
    status?: string = 'pending'; // Mặc định là 'pending'

    @IsOptional()
    @IsEnum(['at_house', 'at_clinic'], {
        message: 'Consultation method must be in_person or online',
    })
    consultationMethod?: string = 'in_person'; // Mặc định là 'in_person'

    @IsOptional()
    @IsString()
    reason?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
