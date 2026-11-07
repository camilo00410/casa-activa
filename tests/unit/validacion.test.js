import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarCorreo, erroresPassword, fortalezaPassword, validarRegistro, validarPerfilSalud, validarRecomendacion, validarHabito } from '../../src/dominio/validacion.js';
import { calcularIMC, clasificarIMC } from '../../src/dominio/salud.js';
import { PERFIL_VALIDO, REGISTRO_VALIDO } from './ayudas.js';

test('correo: acepta formatos válidos y rechaza los incompletos', () => {
  assert.ok(validarCorreo('ana@correo.com'));
  assert.ok(validarCorreo('  ana.p+1@sub.correo.co '));
  for (const malo of ['', 'ana', 'ana@', '@correo.com', 'ana@correo', 'a b@correo.com']) assert.equal(validarCorreo(malo), false, malo);
});

test('contraseña: exige longitud, letra y número, y rechaza las comunes', () => {
  assert.match(erroresPassword('Ab1'), /8 caracteres/);
  assert.match(erroresPassword('solamenteletras'), /letra y un número/);
  assert.match(erroresPassword('12345678'), /letra y un número/);
  assert.match(erroresPassword('password1'), /común/);
  assert.match(erroresPassword('ana@correo.com1', 'ana@correo.com1'), /igual a tu correo/);
  assert.equal(erroresPassword('Segura2026'), null);
});

test('fortaleza: aumenta con longitud y variedad', () => {
  assert.equal(fortalezaPassword(''), 0);
  assert.equal(fortalezaPassword('debil'), 1);
  assert.equal(fortalezaPassword('Segura2026'), 2);
  assert.equal(fortalezaPassword('Segura2026*Larga'), 4);
});

test('registro: exige mayoría de edad y autorización expresa', () => {
  assert.equal(validarRegistro(REGISTRO_VALIDO).valido, true);
  const { errores } = validarRegistro({ ...REGISTRO_VALIDO, mayorDeEdad: false, autorizaDatos: false, confirmacion: 'otra' });
  assert.ok(errores.mayorDeEdad && errores.autorizaDatos && errores.confirmacion);
});

test('registro: rechaza signos de marcado en el nombre', () => {
  assert.ok(validarRegistro({ ...REGISTRO_VALIDO, nombre: '<script>' }).errores.nombre);
});

test('perfil de salud: sin autorización explícita no es válido', () => {
  assert.equal(validarPerfilSalud(PERFIL_VALIDO).valido, true);
  assert.ok(validarPerfilSalud({ ...PERFIL_VALIDO, autorizaSalud: false }).errores.autorizaSalud);
});

test('perfil de salud: el peso y la talla son opcionales, pero si vienen se validan', () => {
  assert.equal(validarPerfilSalud({ ...PERFIL_VALIDO, pesoKg: '', tallaCm: '' }).valido, true);
  assert.ok(validarPerfilSalud({ ...PERFIL_VALIDO, pesoKg: 5 }).errores.pesoKg);
  assert.ok(validarPerfilSalud({ ...PERFIL_VALIDO, tallaCm: 400 }).errores.tallaCm);
});

test('perfil de salud: rechaza menores de edad y valores desconocidos', () => {
  assert.ok(validarPerfilSalud({ ...PERFIL_VALIDO, edad: 17 }).errores.edad);
  assert.ok(validarPerfilSalud({ ...PERFIL_VALIDO, objetivo: 'otro' }).errores.objetivo);
  assert.ok(validarPerfilSalud({ ...PERFIL_VALIDO, condiciones: ['inventada'] }).errores.condiciones);
});

test('recomendación: exige fuente con enlace https', () => {
  const base = { titulo: 'Un título válido', resumen: 'Un resumen con la longitud suficiente.', categoria: 'descanso', nivel: 'principiante', minutos: 10, objetivos: ['dormir-mejor'], pasos: ['Paso'], beneficios: ['Beneficio'], excluye: [], fuente: { nombre: 'OMS', url: 'https://www.who.int/x' } };
  assert.equal(validarRecomendacion(base).valido, true);
  assert.ok(validarRecomendacion({ ...base, fuente: { nombre: '', url: 'https://www.who.int' } }).errores.fuenteNombre);
  assert.ok(validarRecomendacion({ ...base, fuente: { nombre: 'OMS', url: 'javascript:alert(1)' } }).errores.fuenteUrl, 'un enlace javascript: debe rechazarse');
  assert.ok(validarRecomendacion({ ...base, fuente: { nombre: 'OMS', url: 'http://inseguro.com' } }).errores.fuenteUrl);
});

test('hábito: la meta debe estar entre 1 y 7 días', () => {
  const base = { nombre: 'Leer', categoria: 'bienestar', metaSemanal: 3 };
  assert.equal(validarHabito(base).valido, true);
  assert.ok(validarHabito({ ...base, metaSemanal: 8 }).errores.metaSemanal);
  assert.ok(validarHabito({ ...base, nombre: 'a' }).errores.nombre);
});

test('IMC: calcula y clasifica según los umbrales de la OMS', () => {
  assert.equal(calcularIMC(70, 175), 22.9);
  assert.equal(calcularIMC(0, 170), null);
  assert.equal(calcularIMC('', 170), null);
  assert.equal(clasificarIMC(18.4), 'Bajo peso');
  assert.equal(clasificarIMC(18.5), 'Peso normal');
  assert.equal(clasificarIMC(24.9), 'Peso normal');
  assert.equal(clasificarIMC(25), 'Sobrepeso');
  assert.equal(clasificarIMC(30), 'Obesidad');
  assert.equal(clasificarIMC(null), null);
});
