import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const PresupuestoSlider = ({ min = 0, max = 5000, step = 50 }) => {
  const [range, setRange] = useState([min, max]);

  const handleChange = (value) => {
    setRange(value);
  };

  return (
    <Card className="w-full max-w-xl mx-auto mt-8 p-6 rounded-2xl shadow-md">
      <CardContent>
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Rango de presupuesto</Label>
          <Slider
            min={min}
            max={max}
            step={step}
            defaultValue={range}
            value={range}
            onValueChange={handleChange}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>€{range[0]}</span>
            <span>€{range[1]}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PresupuestoSlider;
