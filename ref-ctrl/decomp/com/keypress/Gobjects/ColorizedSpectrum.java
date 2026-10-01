/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.Colorizer;
import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import java.awt.Color;

public class ColorizedSpectrum
extends Colorizer {
    SimpleMeasure univariate;
    static final double _kUVLimit = 3800.0;
    static final double _kPureGreen = 5100.0;
    static final double _kPureRed = 6450.0;
    static final double _kPureBlue = 4400.0;
    static final double _kIRLimit = 7800.0;
    static final double _kLowVisibleSpectrum = 3850.0;
    static final double _kHighVisibleSpectrum = 6750.0;

    public ColorizedSpectrum(GObject iMeasure, double iDomainLow, double iDomainHi, int boundaryCondition) {
        super(iDomainLow, iDomainHi, boundaryCondition);
        this.univariate = (SimpleMeasure)iMeasure;
    }

    public boolean applyColor(GObject image) {
        if (this.univariate.isDefined()) {
            double lambdaFrac;
            double parameter = this.parameterizeAndClipToRange(this.univariate.value);
            double r = 0.0;
            double g = 0.0;
            double b = 0.0;
            double waveLength = 3850.0 + parameter * 2900.0;
            if (waveLength < 4400.0 && waveLength > 3800.0) {
                b = 1.0;
                r = (4400.0 - waveLength) / 600.0;
            } else if (waveLength < 5100.0) {
                lambdaFrac = (5100.0 - waveLength) / 700.0;
                g = 1.0 - lambdaFrac * lambdaFrac;
                lambdaFrac = (waveLength - 4400.0) / 700.0;
                b = 1.0 - lambdaFrac * lambdaFrac;
            } else if (waveLength < 6450.0) {
                lambdaFrac = (waveLength - 5100.0) / 1350.0;
                g = 1.0 - lambdaFrac * lambdaFrac;
                lambdaFrac = (6450.0 - waveLength) / 1350.0;
                r = 1.0 - lambdaFrac * lambdaFrac;
            } else if (waveLength < 7800.0) {
                r = 1.0;
            } else {
                r = 1.0;
                g = 1.0;
                b = 1.0;
            }
            if (waveLength > 7000.0) {
                double sss = 0.3 + 0.7 * (7800.0 - waveLength) / 800.0;
                r *= sss;
                g *= sss;
                b *= sss;
            }
            image.setColor(new Color((float)r, (float)g, (float)b));
            return true;
        }
        return false;
    }
}

