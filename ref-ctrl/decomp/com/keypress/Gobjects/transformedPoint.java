/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import com.keypress.Gobjects.GObject;
import com.keypress.Gobjects.Transformer;
import com.keypress.Gobjects.doublePoint;
import com.keypress.Gobjects.gPoint;

public class transformedPoint
extends gPoint {
    Transformer transform;

    public boolean isColorized() {
        return this.transform.imageIsColorized();
    }

    public transformedPoint(GObject[] theParents, Transformer myTransformer) {
        super(theParents.length);
        this.AssignParents(theParents);
        this.transform = myTransformer;
    }

    public void Constrain(boolean locusDriving) {
        boolean bl = this.existing = this.parentsExisting() && this.transform.prepareTransformer(this);
        if (this.existing) {
            gPoint preImage = (gPoint)this.getParent(0);
            doublePoint image = this.transform.imageXY(preImage.x, preImage.y);
            this.x = image.x;
            this.y = image.y;
        }
    }
}

