/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.doublePoint;
import com.keypress.Gobjects.filledCircle;

public class transformedFilledCircle
extends filledCircle {
    Transformer transform;

    public boolean isColorized() {
        return this.transform.imageIsColorized();
    }

    public transformedFilledCircle(GObject[] theParents, Transformer myTransformer) {
        super(theParents.length);
        this.AssignParents(theParents);
        this.setColor(this.getParent(0).getColor());
        this.transform = myTransformer;
    }

    public void Constrain(boolean locusDriving) {
        boolean bl = this.existing = this.parentsExisting() && this.transform.prepareTransformer(this);
        if (this.existing) {
            filledCircle preImage = (filledCircle)this.getParent(0);
            doublePoint image = this.transform.imageXY(preImage.getCenterX(), preImage.getCenterY());
            this.centerX = image.x;
            this.centerY = image.y;
            this.radius = this.transform.imageScalar(preImage.radius);
            this.updateSecondaryConstraints();
        }
    }
}

