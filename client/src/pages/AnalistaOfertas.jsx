import { useEffect, useState } from "react";

export function AnalistaOfertas(){
  const [ofertas, setOfertas] = useState();
  
  useEffect(() => {
    console.log("Ofertas para el analista");
  }, [])

  return (
    <section>
      test
    </section>
  )
}
