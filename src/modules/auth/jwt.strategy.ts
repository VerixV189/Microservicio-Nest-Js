import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
  [key: string]: any; // Por si vienen más campos del otro microservicio
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      // Extrae el token del formato "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Usamos la misma clave con la que el microservicio de Auth firmó el token
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'tu_clave_secreta_por_defecto',
      ),
    });
  }

  /**
   * Este método se ejecuta automáticamente si la firma y expiración del JWT son válidas.
   * Lo que devuelvas aquí se inyectará en el objeto Request.
   */
  validate(payload: JwtPayload): string {
    // El payload depende de cómo estructuraron el JWT en tu ecosistema.
    // Asumimos que viene con el 'sub' o 'id' del usuario.
    if (!payload || !payload.sub) {
      throw new UnauthorizedException(
        'Token inválido: Falta el identificador del usuario',
      );
    }

    // Retornamos el id del usuario (puedes retornar el objeto entero si necesitas roles, etc.)
    return payload.sub;
  }
}
