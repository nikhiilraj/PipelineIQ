export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponseDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: import('./user.js').UserDTO;
}
