/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.SimpleMeasure;
import com.keypress.Gobjects.parseList;
import java.awt.Font;

public class CompoundMeasure
extends SimpleMeasure {
    parseList theExpression;
    boolean initialized = false;

    public CompoundMeasure(String expr, String prefix, Font myFont, GObject[] parents, int baseX, int baseY, double ConversionFactor, int digitsOfPrecision) {
        super(prefix, myFont, parents, baseX, baseY, 10, ConversionFactor, digitsOfPrecision);
        this.theExpression = new parseList(expr, this);
        this.initialized = true;
    }

    protected void updateValue(boolean updateStringRep) {
        if (this.initialized) {
            this.existing = this.parentsExisting();
            if (this.existing) {
                this.isDefined = true;
                try {
                    this.value = this.theExpression.evaluate(0.0);
                }
                catch (Exception e) {
                    this.isDefined = false;
                }
            } else {
                this.isDefined = false;
            }
        } else {
            this.value = 0.0;
        }
        if (updateStringRep) {
            this.convertValueToString();
        }
    }
}

