/*
 * Decompiled with CFR 0.152.
 */
package com.keypress.Gobjects;

public class unknownItemListError
extends Exception {
    public int unknownItemList;

    public unknownItemListError(int offendingItemList) {
        super("No such itemList #" + offendingItemList);
        this.unknownItemList = offendingItemList;
    }
}

