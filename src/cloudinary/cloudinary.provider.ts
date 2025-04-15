import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return cloudinary.config({
      cloud_name: 'drbfk0it9',
      api_key: '186443578522722',
      api_secret: 'vuxXrro8h5VwdYCPFppAZUkB4oI',
    });
  },
};
