/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Axis;
import com.keypress.Gobjects.CoordSysByAxes;
import com.keypress.Gobjects.Function;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SamplerCurve;
import com.keypress.Gobjects.parseEvalFailure;
import com.keypress.Gobjects.pathWalk;

public class FunctionPlot
extends SamplerCurve {
    static final int y_fx = 0;
    static final int x_fy = 1;
    static final int r_ftheta = 2;
    static final int theta_fr = 3;
    static final int MAX_KNOWN_PROJECTION = 3;
    double domainStart = 0.0;
    double domainEnd = 0.0;
    int projection = 0;

    public FunctionPlot(GObject myFunction, GObject myCoordSys, int numSamples, double domainStart, double domainEnd, int projection) {
        super(myFunction, myCoordSys, numSamples);
        this.domainStart = domainStart;
        this.domainEnd = domainEnd;
        if (this.domainEnd < this.domainStart) {
            this.domainStart = domainEnd;
            this.domainEnd = domainStart;
        }
        this.projection = projection < 0 || projection > 3 ? 0 : projection;
    }

    void recordSample(GObject traceGObj, int sample) {
    }

    public boolean getPointOnPath(pathWalk oReturn, double iFraction) {
        double independentVar = this.domainStart + (this.domainEnd - this.domainStart) * iFraction;
        Function function = (Function)this.getParent(0);
        boolean pathPointexists = false;
        if (function.getFunction().parentsWellDefined()) {
            double evaluation = 0.0;
            try {
                evaluation = function.getFunction().evaluate(independentVar);
                if (!Double.isInfinite(evaluation)) {
                    pathPointexists = true;
                    CoordSysByAxes coordSys = (CoordSysByAxes)this.getParent(1);
                    Axis xAxis = (Axis)coordSys.getAxisX();
                    Axis yAxis = (Axis)coordSys.getAxisY();
                    switch (this.projection) {
                        case 3: {
                            oReturn.sampleX = xAxis.getOrigin() + independentVar * Math.cos(evaluation) * xAxis.getUnitScale();
                            oReturn.sampleY = yAxis.getOrigin() - independentVar * Math.sin(evaluation) * yAxis.getUnitScale();
                            break;
                        }
                        case 2: {
                            oReturn.sampleX = xAxis.getOrigin() + evaluation * Math.cos(independentVar) * xAxis.getUnitScale();
                            oReturn.sampleY = yAxis.getOrigin() - evaluation * Math.sin(independentVar) * yAxis.getUnitScale();
                            break;
                        }
                        case 1: {
                            oReturn.sampleX = xAxis.getOrigin() + evaluation * xAxis.getUnitScale();
                            oReturn.sampleY = yAxis.getOrigin() - independentVar * yAxis.getUnitScale();
                            break;
                        }
                        default: {
                            oReturn.sampleX = xAxis.getOrigin() + independentVar * xAxis.getUnitScale();
                            oReturn.sampleY = yAxis.getOrigin() - evaluation * yAxis.getUnitScale();
                        }
                    }
                }
            }
            catch (parseEvalFailure pef) {
                // empty catch block
            }
        }
        return pathPointexists;
    }

    public void Constrain(boolean locusDriving) {
        this.existing = false;
        ++this.samplerConstraintStability;
        if (this.parentsExisting()) {
            Function function = (Function)this.getParent(0);
            CoordSysByAxes coordSys = (CoordSysByAxes)this.getParent(1);
            Axis xAxis = (Axis)coordSys.getAxisX();
            Axis yAxis = (Axis)coordSys.getAxisY();
            if (function.getFunction().parentsWellDefined()) {
                double increment = Math.abs(this.domainEnd - this.domainStart) / (double)(this.numSamples - 1);
                double independentVar = this.domainStart;
                for (int i = 0; i < this.numSamples; ++i) {
                    if (i + 1 == this.numSamples) {
                        independentVar = this.domainEnd;
                    }
                    double evaluation = 0.0;
                    try {
                        evaluation = function.getFunction().evaluate(independentVar);
                        this.sampleExists[i] = !Double.isInfinite(evaluation);
                    }
                    catch (parseEvalFailure pef) {
                        this.sampleExists[i] = false;
                    }
                    if (this.sampleExists[i]) {
                        switch (this.projection) {
                            case 3: {
                                this.sampleX[i] = xAxis.getOrigin() + independentVar * Math.cos(evaluation) * xAxis.getUnitScale();
                                this.sampleY[i] = yAxis.getOrigin() - independentVar * Math.sin(evaluation) * yAxis.getUnitScale();
                                break;
                            }
                            case 2: {
                                this.sampleX[i] = xAxis.getOrigin() + evaluation * Math.cos(independentVar) * xAxis.getUnitScale();
                                this.sampleY[i] = yAxis.getOrigin() - evaluation * Math.sin(independentVar) * yAxis.getUnitScale();
                                break;
                            }
                            case 1: {
                                this.sampleX[i] = xAxis.getOrigin() + evaluation * xAxis.getUnitScale();
                                this.sampleY[i] = yAxis.getOrigin() - independentVar * yAxis.getUnitScale();
                                break;
                            }
                            default: {
                                this.sampleX[i] = xAxis.getOrigin() + independentVar * xAxis.getUnitScale();
                                this.sampleY[i] = yAxis.getOrigin() - evaluation * yAxis.getUnitScale();
                            }
                        }
                        this.existing = true;
                    }
                    independentVar += increment;
                }
            }
        }
    }
}

