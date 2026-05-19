import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { generatePdf } from "../../lib/generatePdfFicha";
import { FichaTecnicaPdf, PdfManualFields } from "./FichaTecnicaPdf";
import type { Property } from "../PropertyCard";
import type { Development } from "../../data/developments";
import { useAuth } from "../../contexts/AuthContext";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

interface PdfDownloadModalProps {
  data: Property | Development;
  type: "property" | "development";
  className?: string;
}

export function PdfDownloadModal({ data, type, className }: PdfDownloadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  
  const [includeLogo, setIncludeLogo] = useState(true);
  const [fields, setFields] = useState<PdfManualFields>({
    frente: "",
    fondo: "",
    incluidoMantenimiento: "",
    publicidad: "No",
    jardinM2: "",
    salaTv: "No",
    estudio: "No",
    unidadesPrivativas: "",
    enCoto: "No",
    vigilancia: "No",
    jardin: "No",
    terraza: "No",
    balcon: "No",
    amueblado: "No",
    estudiantes: "No",
    mascota: "No",
    cuartoServicio: "No",
    banoServicio: "No",
    condicionesVisita: "",
  });

  const handleChange = (key: keyof PdfManualFields, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const loadingToast = toast.loading("Generando PDF...");
      
      const fileName = `Ficha_Tecnica_${type === "development" ? (data as Development).name : (data as Property).title}.pdf`
        .replace(/[^a-zA-Z0-9-_\.]/g, "_");

      await generatePdf(
        <FichaTecnicaPdf 
          data={data} 
          type={type} 
          includeLogo={includeLogo} 
          user={user} 
          manualFields={fields}
        />,
        fileName
      );

      toast.success("PDF generado exitosamente.", { id: loadingToast });
      setIsOpen(false);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Ocurrió un error al generar el PDF. Intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderInput = (label: string, key: keyof PdfManualFields, placeholder?: string) => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-slate-500 font-medium uppercase">{label}</Label>
      <Input 
        value={fields[key]} 
        onChange={(e) => handleChange(key, e.target.value)} 
        placeholder={placeholder}
        className="h-8 text-sm"
      />
    </div>
  );

  const renderSwitch = (label: string, key: keyof PdfManualFields) => (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-slate-500 font-medium uppercase">{label}</Label>
      <div className="flex items-center gap-2">
        <Switch 
          checked={fields[key] === "Si"} 
          onCheckedChange={(checked) => handleChange(key, checked ? "Si" : "No")} 
        />
        <span className="text-sm font-medium text-slate-700">{fields[key] || "No"}</span>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={isGenerating}
          className={className || "rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"}
          title="Configurar y Descargar PDF"
          aria-label="Descargar Ficha Técnica"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          ) : (
            <Download className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Configurar Ficha Técnica PDF</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-0.5">
              <Label className="text-base">Membrete Viterra</Label>
              <p className="text-sm text-slate-500">Incluir el logotipo de Viterra en la primera página.</p>
            </div>
            <Switch checked={includeLogo} onCheckedChange={setIncludeLogo} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-4 border-b pb-2">Información Adicional (Manual)</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {renderInput("Frente (m)", "frente", "Ej. 10")}
              {renderInput("Fondo (m)", "fondo", "Ej. 20")}
              {renderInput("Mantenimiento", "incluidoMantenimiento", "Ej. Agua, Luz")}
              {renderSwitch("Publicidad", "publicidad")}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {renderInput("Jardín M²", "jardinM2", "Ej. 15")}
              {renderSwitch("Sala TV", "salaTv")}
              {renderSwitch("Estudio", "estudio")}
              {renderInput("Unid. Privativas", "unidadesPrivativas", "Ej. 4")}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
              {renderSwitch("En Coto", "enCoto")}
              {renderSwitch("Vigilancia", "vigilancia")}
              {renderSwitch("Jardín", "jardin")}
              {renderSwitch("Terraza", "terraza")}
              {renderInput("Balcón", "balcon", "Ej. Si (2)")}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
              {renderSwitch("Amueblado", "amueblado")}
              {renderSwitch("Estudiantes", "estudiantes")}
              {renderSwitch("Mascota", "mascota")}
              {renderSwitch("Cuarto Serv.", "cuartoServicio")}
              {renderSwitch("Baño Serv.", "banoServicio")}
            </div>

            <div className="mt-4">
              {renderInput("Condiciones de visita / Restricciones", "condicionesVisita", "Ej. Con cita con Héctor")}
            </div>
          </div>
          
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-[#7a171d] hover:bg-[#631217] text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Generar Ficha PDF
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
