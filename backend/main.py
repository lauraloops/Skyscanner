

# FastAPI version
from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from pydantic import BaseModel
from typing import List, Union

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UsuarioVibes(BaseModel):
    usuario: str
    origen: str
    vibes: list


class TextoCreativo(BaseModel):
    texto: str




@app.post("/guardar_texto/")
async def guardar_texto(texto: TextoCreativo = Body(...)):
    ruta = os.path.join(os.path.dirname(__file__), '../frontend/src/textos_creativos.json')
    try:
        if os.path.exists(ruta):
            with open(ruta, 'r', encoding='utf-8') as f:
                try:
                    datos = json.load(f)
                except Exception:
                    datos = []
        else:
            datos = []
        datos.append(texto.dict())
        with open(ruta, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
        return {"ok": True, "msg": "Texto guardado"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/guardar_presupuesto/")
async def guardar_presupuesto(presupuesto: int = Body(...)):
    ruta = os.path.join(os.path.dirname(__file__), '../frontend/src/presupuestos.json')
    try:
        if os.path.exists(ruta):
            with open(ruta, 'r', encoding='utf-8') as f:
                try:
                    datos = json.load(f)
                except Exception:
                    datos = []
        else:
            datos = []
        datos.append(presupuesto)
        with open(ruta, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
        return {"ok": True, "msg": "Presupuesto guardado"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/guardar_usuario")
async def guardar_usuario(usuarios: Union[UsuarioVibes, List[UsuarioVibes]] = Body(...)):
    # Acepta tanto un solo usuario como una lista
    if isinstance(usuarios, dict):
        usuarios = [UsuarioVibes(**usuarios)]
    elif isinstance(usuarios, UsuarioVibes):
        usuarios = [usuarios]
    elif isinstance(usuarios, list):
        usuarios = [UsuarioVibes(**u) if isinstance(u, dict) else u for u in usuarios]

    ruta = os.path.join(os.path.dirname(__file__), '../frontend/src/usuarios_vibes.json')
    try:
        # Leer los usuarios existentes
        if os.path.exists(ruta):
            with open(ruta, 'r', encoding='utf-8') as f:
                try:
                    datos = json.load(f)
                except Exception:
                    datos = []
        else:
            datos = []
        # Añadir los nuevos usuarios
        for usuario in usuarios:
            datos.append(usuario.dict())
        # Guardar el archivo actualizado
        with open(ruta, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
        return {"ok": True, "msg": "Usuarios guardados"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

