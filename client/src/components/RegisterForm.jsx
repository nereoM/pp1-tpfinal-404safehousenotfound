import PasswordInput from './PasswordInput';

export default function RegisterForm({
  registerName, registerSurname, registerUsername,
  registerEmail, registerPassword, registerRepeatPassword,
  registerPasswordVisible, registerRepeatPasswordVisible,
  setRegisterName, setRegisterSurname, setRegisterUsername,
  setRegisterEmail, setRegisterPassword, setRegisterRepeatPassword,
  setRegisterPasswordVisible, setRegisterRepeatPasswordVisible,
  handleSubmitRegister, registerError, registerSuccess,
  loadingRegister, setFlipped, resetRegisterFields
}) {
  return (
    <form onSubmit={handleSubmitRegister} className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl w-full h-full shadow-xl space-y-5 border border-white/20">
      <h2 className="text-2xl font-semibold text-center text-white">Registrarse</h2>

      <input type="text" placeholder="Nombre" value={registerName} onChange={(e) => setRegisterName(e.target.value)}
        className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      <input type="text" placeholder="Apellido" value={registerSurname} onChange={(e) => setRegisterSurname(e.target.value)}
        className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      <input type="text" placeholder="Nombre de Usuario" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)}
        className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      <input type="email" placeholder="Email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)}
        className="w-full p-3 rounded bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />

      <PasswordInput
        value={registerPassword}
        onChange={(e) => setRegisterPassword(e.target.value)}
        visible={registerPasswordVisible}
        setVisible={setRegisterPasswordVisible}
        placeholder="Contraseña"
      />

      <PasswordInput
        value={registerRepeatPassword}
        onChange={(e) => setRegisterRepeatPassword(e.target.value)}
        visible={registerRepeatPasswordVisible}
        setVisible={setRegisterRepeatPasswordVisible}
        placeholder="Repetir Contraseña"
      />

      {registerError && <p className="text-red-500 text-sm text-center">{registerError}</p>}
      {registerSuccess && <p className="text-green-500 text-sm text-center">¡Registro exitoso! Verifique su email</p>}

      <button type="submit" className="w-full bg-white/10 hover:bg-white/20 transition p-3 rounded text-white font-medium" disabled={loadingRegister}>
        {loadingRegister ? "Cargando..." : "Registrarse"}
      </button>

      <div className="text-sm text-center text-gray-300">
        ¿Ya tienes cuenta?{" "}
        <button type="button" onClick={() => { resetRegisterFields(); setFlipped(false); }} className="text-blue-400 hover:underline">
          Inicia sesión acá
        </button>
      </div>
    </form>
  );
}
