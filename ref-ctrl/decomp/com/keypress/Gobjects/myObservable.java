/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

import java.util.Observable;

public class myObservable
extends Observable {
    public void updateObservers(Object arg) {
        this.setChanged();
        this.notifyObservers(arg);
    }
}

