/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.gText;
import java.awt.Font;

public abstract class gMeasure
extends gText {
    private String suffix = "";
    protected String prefix = "";
    public boolean isDefined;
    public String valueStr;
    public static float pixelsPerLengthUnit = 1.0f;
    int digits;

    public gMeasure(String Prefix, Font myFont, int numParents, GObject[] parents, int baseX, int baseY, int digitsOfPrecision) {
        super(myFont, numParents, parents, baseX, baseY, "");
        this.prefix = Prefix;
        this.digits = digitsOfPrecision;
    }

    public void setDigits(int numDigits) {
        this.digits = numDigits;
    }

    public int getDigits() {
        return this.digits;
    }

    public String roundedDoubleString(double value) {
        String returnString;
        if (this.getDigits() > 0) {
            double numDigitsExp = Math.pow(10.0, this.getDigits());
            returnString = String.valueOf((double)Math.round(value * numDigitsExp) / numDigitsExp);
            int predictedDecimalLocation = returnString.length() - 1 - this.getDigits();
            if (predictedDecimalLocation < 0 || returnString.charAt(predictedDecimalLocation) != '.') {
                double absvalue = Math.abs(value);
                if (absvalue > 3000000.0 || absvalue < 1.0E-6 && absvalue != 0.0) {
                    returnString = String.valueOf(value);
                    predictedDecimalLocation = returnString.indexOf(46);
                    int eLocation = returnString.indexOf(69);
                    if (eLocation >= predictedDecimalLocation + 1 + this.getDigits()) {
                        returnString = returnString.substring(0, predictedDecimalLocation + 1 + this.getDigits()) + returnString.substring(eLocation, returnString.length());
                    }
                } else {
                    int origLength = returnString.length();
                    for (int i = 0; i < this.getDigits() - (origLength - returnString.lastIndexOf(46) - 1); ++i) {
                        returnString = returnString.concat("0");
                    }
                }
            }
        } else {
            returnString = String.valueOf(Math.round(value));
        }
        return returnString;
    }

    protected abstract void updateValue(boolean var1);

    public static void changePixelsPerLengthUnit(float newPixelsPerLengthUnit) {
        pixelsPerLengthUnit = newPixelsPerLengthUnit;
    }

    private void updateMsg() {
        if (this.existing) {
            this.msg = this.prefix + this.valueStr + this.suffix;
        }
    }

    public final boolean isDefined() {
        return this.isDefined;
    }

    public void Constrain(boolean locusDriving) {
        this.updateValue(!locusDriving);
        if (!locusDriving) {
            this.updateMsg();
        }
    }

    void setPrefix(String pref) {
        this.prefix = pref;
        this.updateMsg();
    }

    public void setSuffix(String suff) {
        this.suffix = suff;
        this.updateMsg();
    }
}

