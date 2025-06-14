import { Dialog, DialogContent, DialogTitle } from "./shadcn/Dialog";
import { useState } from "react";
import {
  PasoUnoEncuesta,
  PasoDosEncuesta,
  PasoTresEncuesta,
  PasoCuatroEncuesta,
} from "./EncuestaModal";

export function ModalEncuesta({ open, onOpenChange }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const handleClose = () => {
    setStep(1);
    setFormData({});
    onOpenChange(false);
  };

  const handleFinalizar = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/encuestas/crear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Error al crear encuesta");
      handleClose();
    } catch (error) {
      console.error(error);
      alert("Hubo un problema al crear la encuesta.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="space-y-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-xl font-bold text-black">Crear Encuesta</DialogTitle>

        {step === 1 && (
          <PasoUnoEncuesta
            formData={formData}
            setFormData={setFormData}
            onNext={() => setStep(2)}
            onCancel={handleClose}
          />
        )}

        {step === 2 && (
          <PasoDosEncuesta
            formData={formData}
            setFormData={setFormData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            onCancel={handleClose}
          />
        )}

        {step === 3 && (
          <PasoTresEncuesta
            formData={formData}
            setFormData={setFormData}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <PasoCuatroEncuesta
            formData={formData}
            onBack={() => setStep(3)}
            onFinish={handleFinalizar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
