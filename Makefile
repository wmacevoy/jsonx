
test_% : tests/test_%.js src/%.js
	opc/qjs.ape.exe --std -m tests/test_$*.js
	docker run --rm -v $$(pwd):/app -w /app node node tests/test_$*.js

#test_js64 : tests/test_js64.js src/js64.js
#	opc/qjs.ape.exe -m tests/test_js64.js

#test_load_json_sync : tests/test_load_json_sync.js src/load_json_sync.js
#	opc/qjs.ape.exe --std -m tests/test_load_json_sync.js

test_ex1 : tests/test_ex1.js tests/ex1.js
	opc/qjs.ape.exe --std -m tests/test_ex1.js
	docker run --rm -v $$(pwd):/app -w /app node node tests/test_ex1.js

tests : test_js64 test_read_utf8 test_read_blob test_ex1 test_sha256