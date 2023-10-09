import {
    TemplateCategory,
} from "@levigo/ngx-webtoolkit";

/**
 * Demo Documents, that will be loaded from src/main/resources/documents on the server
 */
export const DEMO_DOCUMENTS: TemplateCategory[] = [{
    title: {content: "templateCategories.demoDocuments", translate: true},
    templates: [{
        data: "classpath:PDFUA.pdf",
        imageRefs: ["/assets/img/ua.png", null],
        title: {content: "documents.ua.title", translate: true},
        description: {content: "documents.ua.description", translate: true}
    }, {
        data: "classpath:jadicewebtoolkit.pdf",
        imageRefs: ["/assets/img/factsheet1.png", "/assets/img/factsheet2.png"],
        title: {content: "documents.factsheet.title", translate: true},
        description: {content: "documents.factsheet.description", translate: true}
    }, {
        data: "classpath:testdoc_rendering-protected.pdf",
        imageRefs: ["/assets/img/passworddoc.png", null],
        title: {content: "documents.passwordProtected.title", translate: true},
        description: {content: "documents.passwordProtected.description", translate: true}
    }]
}, {
    title: {content: "templateCategories.digiBib", translate: true},
    templates: [{
        data: "http://www.digbib.org/Franz_Kafka_1883/Die_Verwandlung_.pdf",
        imageRefs: ["/assets/img/verwandlung1.png", "/assets/img/verwandlung2.png"],
        title: {content: "documents.verwandlung.title", translate: true},
        description: {content: "documents.verwandlung.description", translate: true}
    }, {
        data: "http://www.digbib.org/William_Shakespeare_1564/De_Romeo_und_Juliette_.pdf",
        imageRefs: ["/assets/img/romeo.png", null],
        title: {content: "documents.romeo.title", translate: true},
        description: {content: "documents.romeo.description", translate: true}
    }]
}, {
    title: {content: "templateCategories.miscFormats", translate: true},
    templates: [{
        data: "classpath:baxterbay.afp",
        imageRefs: ["/assets/img/baxterbay.png", null],
        title: {content: "documents.baxterbay.title", translate: true},
        description: {content: "documents.baxterbay.description", translate: true}
    }, {
        data: "classpath:xrechnung.xml",
        imageRefs: ["/assets/img/xrechnung1.png", "/assets/img/xrechnung2.png"],
        title: {content: "documents.xrechnung.title", translate: true},
        description: {content: "documents.xrechnung.description", translate: true}
    }]
}];
